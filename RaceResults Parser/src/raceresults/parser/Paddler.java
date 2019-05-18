/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package raceresults.parser;

/**
 * A paddler with their name and division
 * @author mattp
 */
public class Paddler {
    public String name;
    public String div;
    public String club;
    public String race_class;
    public String bcu;
    
    
    public Paddler(String n, String d, String c, String rc, String b){
        this.name = n;
        this.div = d;
        this.club = c;
        this.race_class = rc;
        this.bcu = b;
    }    
    
    
}
