/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package raceresults.parser;

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.security.NoSuchAlgorithmException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.net.HttpCookie;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;
import org.mindrot.jbcrypt.BCrypt;
import static raceresults.parser.Database.getConnection;

/**
 *
 * @author 100116544
 */
public class RaceResultsParser {
    private final Connection con;
    
    public RaceResultsParser() throws Exception{
        this.con = getConnection();
    }

    /**
     * Gets all race results and inserts each result into the boat table,
     * the paddler boat table and then onto the race results table
     * @throws Exception 
     */
    public void SortToBoats() throws Exception {
        int resultRows = 0;
        
        String sql = "SELECT * FROM raceresults ";
        PreparedStatement st = this.con.prepareStatement(sql);
        
        ResultSet result = st.executeQuery();
        while(result.next()){
            System.out.println("Row: " + result.getRow());
            String boatNum = "";
            String raceDiv = result.getString("raceDivision");
            String paddler = result.getString("paddlerID");
            String pos = result.getString("position");
            String time = result.getString("time");
            int resultID = result.getInt("resultID");
            //System.out.println(raceDiv + " : " + paddler + " : " + pos + " : " + time);
            
            result.next();
            String paddler2 = "";
            if(raceDiv.equals(result.getString("raceDivision")) && time.equals(result.getString("time")) && pos.equals(result.getString("position")) && !time.equals("NA") && !result.getString("time").equals("NA")){
                paddler2 = result.getString("paddlerID");
                System.out.println("K2");
            } else {
                result.previous();
            }
            
            String boat = "INSERT INTO boat (boatNumber, divisionRaced) VALUES (?,?)";
                PreparedStatement x = con.prepareStatement(boat, Statement.RETURN_GENERATED_KEYS);
                x.setString(1, boatNum);
                x.setString(2, raceDiv);
                x.executeUpdate();
                int boatID = 0;
                try (ResultSet key = x.getGeneratedKeys()) {
                    if(key.next()) {
                        boatID = key.getInt(1);
                    }
                }
            String in = "INSERT INTO paddlerboat (paddlerID, boatID) VALUES (?,?)";
            PreparedStatement y = con.prepareStatement(in, Statement.RETURN_GENERATED_KEYS);
            y.setString(1, paddler);
            y.setInt(2, boatID);
            y.executeUpdate();
            if(!paddler2.equals("")){
               String in2 = "INSERT INTO paddlerboat (paddlerID, boatID) VALUES (?,?)";
                PreparedStatement y2 = con.prepareStatement(in2, Statement.RETURN_GENERATED_KEYS);
                y2.setString(1, paddler2);
                y2.setInt(2, boatID);
                y2.executeUpdate(); 
            }
            System.out.println("Row: " + result.getRow());
            System.out.println("--------");
            String update = "UPDATE raceresults SET boatID = ? WHERE resultID = ?";
            PreparedStatement up = con.prepareStatement(update);
            up.setInt(1, boatID);    
            System.out.println("ResultID being updated: " + resultID);
            up.setInt(2, resultID);
            up.executeUpdate();
        }
    }
    
    /**
     * Changes the race division of the boat
     * @throws Exception 
     */
    public void changeDivision() throws Exception {
        String sql = "SELECT * FROM boat ";
        PreparedStatement st = this.con.prepareStatement(sql);
        ResultSet result = st.executeQuery();
        while(result.next()){
            String x = result.getString("divisionRaced");
            x = x.replace("Div", "");
            System.out.println(x);
            String update = "UPDATE boat SET divisionRaced = ? WHERE boatID = ?";
            PreparedStatement u = this.con.prepareStatement(update);
            u.setString(1, x);
            u.setInt(2, result.getInt("boatID"));
            u.executeUpdate();
        }
    }
    
    /**
     * Sets the club name and region field as appropriate from CSV
     * @throws Exception 
     */
    public void setClubInfo() throws Exception {
        String sql = "SELECT * FROM club";
        PreparedStatement st = this.con.prepareStatement(sql);
        ResultSet result = st.executeQuery();
        
        ArrayList<Club> list = new ArrayList<>();
        
        BufferedReader br = new BufferedReader(new FileReader("clubinfo.csv"));
        String line = "";
        String split = ",";
            while ((line = br.readLine()) != null) {
                String[] club = line.split(split);
                Club x = new Club(club[0], club[1], club[2]);
                list.add(x);
        }
            
            
        while(result.next()){
            String x = result.getString("clubcode");
            
            for(Club c : list){
                c.code = c.code.replaceAll("\\s+","");
                
                if(c.code.equals(x)){
                   
                    String get = "SELECT regionID FROM region WHERE regionName = ?";
                    PreparedStatement s = this.con.prepareStatement(get);
                    s.setString(1, c.region);
                    ResultSet regionResult = s.executeQuery();
                    while(regionResult.next()){
                        if(c.code.equals("ACU")){
                            System.out.println(c.name);
                        }
                        if(c.name.equals("")){
                            c.name = c.code;
                        }
                        String regionID = regionResult.getString("regionID");                   
                        String update = "UPDATE club SET clubname = ?, regionID = ? WHERE clubcode = ?";
                        PreparedStatement u = this.con.prepareStatement(update);
                       // IND, INT, NO, WA, 
                        u.setString(1, c.name);
                        u.setString(2, regionID);
                        u.setString(3, c.code);
                        u.executeUpdate();
                    }
                    
                }
            }
        }
    }
    
    /**
     * Sets all club passwords to their club codes
    */
    public void setClubPassword() throws Exception {
        String sql = "SELECT * FROM club";
        PreparedStatement st = this.con.prepareStatement(sql);
        ResultSet result = st.executeQuery();
        
                      
        while(result.next()){
            String hashed = BCrypt.hashpw(result.getString("clubcode"), BCrypt.gensalt(12)); 
            String update = "UPDATE club SET clubPassword = ? WHERE clubID = ?";
            PreparedStatement u = this.con.prepareStatement(update);
            u.setString(1, result.getString("clubcode"));
            u.setString(2, result.getString("clubID"));
            u.executeUpdate();
        }           
    }
    
    /**
     * Updates everyones divisions to the correct ones
     * @throws Exception 
     */
    public void updateDivisionsForAll() throws Exception {
        String sql = "SELECT * FROM paddler";
        PreparedStatement st = this.con.prepareStatement(sql);
        ResultSet result = st.executeQuery();
        ArrayList<Paddler> list = new ArrayList<>();
        
        BufferedReader br = new BufferedReader(new FileReader("paddlers.csv"));
        String line = "";
        String split = ",";
            while ((line = br.readLine()) != null) {
                String[] paddler = line.split(split);
                //Paddler x = new Paddler(paddler[0], paddler[1]);
                //list.add(x);
        }
                      
        while(result.next()){
            String newDiv = "";
            for(Paddler p : list){
                if(p.name.equals(result.getString("name"))){
                    newDiv = p.div;
                    String update = "UPDATE paddler SET division = ? WHERE name = ?";
                    PreparedStatement u = this.con.prepareStatement(update);
                    u.setString(1, newDiv);
                    u.setString(2, p.name);
                    u.executeUpdate();
                }
            }
            
        }           
    }
    
    public void rankingList() throws Exception {
        ArrayList<Paddler> list = new ArrayList<>();
        BufferedReader br = new BufferedReader(new FileReader("rankinglist.csv"));
        String line = "";
        String split = ",";
        while ((line = br.readLine()) != null) {
                String[] paddler = line.split(split);
                String name = paddler[1] + " " + paddler[0];
                Paddler x = new Paddler(name, paddler[6], paddler[2], paddler[3], paddler[4]);
                list.add(x);
        }

        String paddler = "SELECT * FROM paddler";
        PreparedStatement st_paddler = this.con.prepareStatement(paddler);
        ResultSet result_paddler = st_paddler.executeQuery();  
        int count = 0;
        for(Paddler c : list){
            System.out.println(count);
            boolean exists = false;
            while(result_paddler.next()){
                if(c.name.equals(result_paddler.getString("name"))){
                    String update = "UPDATE paddler SET clubID = ?, class = ?, "
                    + "division = ? WHERE name = ?";
                    PreparedStatement u = this.con.prepareStatement(update);
                    u.setString(1, getClubID(c.club));
                    u.setString(2, c.race_class);
                    u.setString(3, c.div);
                    u.setString(4, c.name);
                    u.executeUpdate();
                    exists = true;
                }
            }
            
            if(!exists){
                String insert = "INSERT INTO paddler (name, clubID, division, "
                        + "class, bcu) VALUES (?, ?, ?, ?,?)";
                PreparedStatement in = this.con.prepareStatement(insert);
                in.setString(1, c.name);
                in.setString(2, getClubID(c.club));
                in.setString(3, c.div);
                in.setString(4, c.race_class);
                in.setString(5, c.bcu);
                in.executeUpdate();
            }
            result_paddler.beforeFirst();
            count++;
        }
    }
    
    
    public String getClubID(String code) throws SQLException{
        String sql = "SELECT *  FROM club";    
        PreparedStatement st = this.con.prepareStatement(sql);
        ResultSet result = st.executeQuery();  
        
        
        while(result.next()){
            if(code.contains(result.getString("clubcode"))){
                return result.getString("clubID");
            }
        }
        return "0";
    }
    
    /**
     * Run any of the above commands here
     * @param args
     * @throws Exception 
     */
    public static void main(String[] args) throws Exception {
       RaceResultsParser a = new RaceResultsParser();
       //a.changeDivision();
       a.rankingList();
    }
}